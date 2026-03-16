import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Info, Search, Loader2, ChevronDown } from 'lucide-react';
import { apiClient } from '../../services/api-client';

interface CurrentUserInfo {
  id: string;
  fullName: string;
  email?: string;
}

interface QuickCreateModalProps {
  initialDate: Date;
  initialEndDate?: Date;
  onClose: () => void;
  onSave: (event: any) => void;
  currentUser?: CurrentUserInfo | null;
}

interface Project {
  id: string;
  name: string;
  code: string;
  color?: string;
  isClient?: boolean;
}

interface Task {
  id: string;
  name: string;
  activityId?: string;
  activityName?: string;
}

interface Activity {
  id: string;
  name: string;
  tasks: Task[];
}

export function QuickCreateModal({ initialDate, initialEndDate, onClose, onSave, currentUser }: QuickCreateModalProps) {
  const [eventType, setEventType] = useState<'event' | 'task' | 'timeblock'>('event');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Task state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);

  // Date/time state
  const [date, setDate] = useState(() => {
    const d = new Date(initialDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [startTime, setStartTime] = useState(() => {
    const hours = String(initialDate.getHours()).padStart(2, '0');
    const minutes = String(Math.floor(initialDate.getMinutes() / 15) * 15).padStart(2, '0');
    return `${hours}:${minutes}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const endDate = initialEndDate ?? new Date(initialDate.getTime() + 30 * 60 * 1000);
    const hours = String(endDate.getHours()).padStart(2, '0');
    const minutes = String(Math.floor(endDate.getMinutes() / 15) * 15).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  // Checkbox state
  const [isTimesheet, setIsTimesheet] = useState(true);
  const [isBillable, setIsBillable] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const projectSearchRef = useRef<HTMLInputElement>(null);
  const taskSearchRef = useRef<HTMLInputElement>(null);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load tasks when project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectTasks(selectedProject.id);
    } else {
      setActivities([]);
      setSelectedTask(null);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await apiClient.get('/queries/projects-summary');
      const projectList = (response as any).result || response || [];
      setProjects(projectList.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code || '',
        color: p.color || '#3B82F6',
        isClient: p.client ? true : false
      })));
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadProjectTasks = async (projectId: string) => {
    try {
      setIsLoadingTasks(true);
      setActivities([]);

      // Load project details which include activities and tasks
      const response = await apiClient.get(`/queries/projects/${projectId}`);
      const project = (response as any).result || response;

      if (project.activities) {
        const activityList: Activity[] = project.activities.map((a: any) => ({
          id: a.id,
          name: a.name,
          tasks: (a.tasks || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            activityId: a.id,
            activityName: a.name
          }))
        }));
        setActivities(activityList);
      }
    } catch (error) {
      console.error('Failed to load project tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(projectSearch.toLowerCase())
  );

  // Flatten tasks for dropdown
  const allTasks = activities.flatMap(a => a.tasks);
  const filteredTasks = allTasks.filter(t =>
    t.name.toLowerCase().includes(taskSearch.toLowerCase())
  );

  // Calculate duration
  const calculateDuration = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    if (durationMinutes <= 0) return '0m';
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  // Format date for API: DD/MM/YYYY HH:mm:ss+00:00
  const formatDateTimeForApi = (dateStr: string, timeStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year} ${timeStr}:00+00:00`;
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);

    try {
      const startAt = formatDateTimeForApi(date, startTime);
      const endAt = formatDateTimeForApi(date, endTime);

      const payload: any = {
        id: crypto.randomUUID(),
        title: title.trim(),
        startAt,
        endAt,
        color: selectedProject?.color || '#60A5FA',
        state: 1,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timesheet: isTimesheet,
        billable: isBillable
      };

      // Add project reference if selected
      if (selectedProject) {
        payload.project = { id: selectedProject.id };
      }

      // Add task reference if selected
      if (selectedTask) {
        payload.task = { id: selectedTask.id };
      }

      // Pass to parent for API call
      await onSave({
        ...payload,
        // Also pass Date objects for parent component
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`)
      });
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInfoMessage = () => {
    if (eventType === 'timeblock') {
      return 'Time blocks are private and not included in timesheets.';
    }
    if (selectedTask) {
      return 'Included in timesheet because it\'s linked to a task.';
    }
    if (selectedProject?.isClient) {
      return `Billable because "${selectedProject.name}" is a client project.`;
    }
    if (!isTimesheet) {
      return 'Private events are not included in timesheets by default.';
    }
    return null;
  };

  const infoMessage = getInfoMessage();

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '520px',
          maxHeight: '90vh',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a title..."
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '18px',
              fontWeight: 600,
              color: '#0A0A0A',
              background: 'transparent'
            }}
          />
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#6B7280',
              borderRadius: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Event Type Selector */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['event', 'task', 'timeblock'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setEventType(type);
                    if (type === 'timeblock') {
                      setIsTimesheet(false);
                      setIsBillable(false);
                    } else {
                      setIsTimesheet(true);
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    background: eventType === type ? '#EFF6FF' : 'transparent',
                    border: eventType === type ? '1px solid #0066FF' : '1px solid #E5E7EB',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: eventType === type ? '#0066FF' : '#6B7280',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {type === 'timeblock' ? 'Time Block' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* User Info */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#0066FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {currentUser?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                  {currentUser?.fullName || 'Unknown User'}
                </div>
                <div style={{ fontSize: '12px', color: '#6B7280' }}>
                  {currentUser?.email || ''}
                </div>
              </div>
              <button
                style={{
                  marginLeft: 'auto',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #E5E7EB',
                  background: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                <Calendar size={16} />
              </button>
            </div>
          </div>

          {/* Project Dropdown - Searchable */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Project
            </label>
            <button
              onClick={() => {
                setShowProjectDropdown(!showProjectDropdown);
                setShowTaskDropdown(false);
                setTimeout(() => projectSearchRef.current?.focus(), 100);
              }}
              style={{
                width: '100%',
                height: '40px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                color: selectedProject ? '#0A0A0A' : '#9CA3AF',
                textAlign: 'left'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedProject && (
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: selectedProject.color || '#3B82F6'
                  }} />
                )}
                {selectedProject ? `${selectedProject.code} - ${selectedProject.name}` : 'Select project...'}
              </span>
              {isLoadingProjects ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {showProjectDropdown && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 998
                  }}
                  onClick={() => setShowProjectDropdown(false)}
                />
                <div style={{
                  position: 'absolute',
                  top: '72px',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 999,
                  maxHeight: '300px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Search input */}
                  <div style={{ padding: '8px', borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                      <input
                        ref={projectSearchRef}
                        type="text"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        placeholder="Search projects..."
                        style={{
                          width: '100%',
                          height: '32px',
                          paddingLeft: '32px',
                          paddingRight: '8px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Project list */}
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
                    {/* Clear selection option */}
                    {selectedProject && (
                      <button
                        onClick={() => {
                          setSelectedProject(null);
                          setSelectedTask(null);
                          setShowProjectDropdown(false);
                          setProjectSearch('');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: '1px solid #E5E7EB',
                          fontSize: '13px',
                          color: '#6B7280',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <X size={14} />
                        Clear selection
                      </button>
                    )}

                    {filteredProjects.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                        {isLoadingProjects ? 'Loading projects...' : 'No projects found'}
                      </div>
                    ) : (
                      filteredProjects.map(proj => (
                        <button
                          key={proj.id}
                          onClick={() => {
                            setSelectedProject(proj);
                            setSelectedTask(null);
                            setShowProjectDropdown(false);
                            setProjectSearch('');
                            if (proj.isClient) {
                              setIsBillable(true);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: selectedProject?.id === proj.id ? '#EFF6FF' : 'transparent',
                            border: 'none',
                            fontSize: '13px',
                            color: '#0A0A0A',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = selectedProject?.id === proj.id ? '#EFF6FF' : 'transparent'}
                        >
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: proj.color || '#3B82F6',
                            flexShrink: 0
                          }} />
                          <span style={{ fontWeight: 500 }}>{proj.code}</span>
                          <span style={{ color: '#6B7280' }}>—</span>
                          <span>{proj.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Task Dropdown - Searchable (depends on project) */}
          {eventType !== 'timeblock' && (
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Task (optional)
              </label>
              <button
                onClick={() => {
                  if (selectedProject) {
                    setShowTaskDropdown(!showTaskDropdown);
                    setShowProjectDropdown(false);
                    setTimeout(() => taskSearchRef.current?.focus(), 100);
                  }
                }}
                disabled={!selectedProject}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: !selectedProject ? '#F9FAFB' : 'white',
                  cursor: selectedProject ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  color: selectedTask ? '#0A0A0A' : '#9CA3AF',
                  textAlign: 'left'
                }}
              >
                {!selectedProject ? 'Select a project first...' :
                 selectedTask ? selectedTask.name : 'Select task...'}
                {isLoadingTasks ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {showTaskDropdown && selectedProject && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998
                    }}
                    onClick={() => setShowTaskDropdown(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '72px',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 999,
                    maxHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* Search input */}
                    <div style={{ padding: '8px', borderBottom: '1px solid #E5E7EB' }}>
                      <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                          ref={taskSearchRef}
                          type="text"
                          value={taskSearch}
                          onChange={(e) => setTaskSearch(e.target.value)}
                          placeholder="Search tasks..."
                          style={{
                            width: '100%',
                            height: '32px',
                            paddingLeft: '32px',
                            paddingRight: '8px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    {/* Task list */}
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px' }}>
                      {/* Clear selection option */}
                      {selectedTask && (
                        <button
                          onClick={() => {
                            setSelectedTask(null);
                            setShowTaskDropdown(false);
                            setTaskSearch('');
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #E5E7EB',
                            fontSize: '13px',
                            color: '#6B7280',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <X size={14} />
                          Clear selection
                        </button>
                      )}

                      {isLoadingTasks ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                          Loading tasks...
                        </div>
                      ) : filteredTasks.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                          No tasks found for this project
                        </div>
                      ) : (
                        // Group by activity
                        activities.map(activity => {
                          const activityTasks = activity.tasks.filter(t =>
                            t.name.toLowerCase().includes(taskSearch.toLowerCase())
                          );
                          if (activityTasks.length === 0) return null;

                          return (
                            <div key={activity.id}>
                              <div style={{
                                padding: '8px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#6B7280',
                                background: '#F9FAFB',
                                letterSpacing: '0.05em'
                              }}>
                                {activity.name.toUpperCase()}
                              </div>
                              {activityTasks.map(task => (
                                <button
                                  key={task.id}
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskDropdown(false);
                                    setTaskSearch('');
                                    setIsTimesheet(true); // Tasks always go to timesheet
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: selectedTask?.id === task.id ? '#EFF6FF' : 'transparent',
                                    border: 'none',
                                    fontSize: '13px',
                                    color: '#0A0A0A',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = selectedTask?.id === task.id ? '#EFF6FF' : 'transparent'}
                                >
                                  {task.name}
                                </button>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Date and Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr auto', gap: '12px', marginBottom: '20px', alignItems: 'end' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#0A0A0A'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '8px'
              }}>
                From
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#0A0A0A'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '8px'
              }}>
                To
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#0A0A0A'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '8px'
              }}>
                Duration
              </label>
              <div style={{
                height: '40px',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                background: '#F9FAFB',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#6B7280',
                minWidth: '60px'
              }}>
                {calculateDuration()}
              </div>
            </div>
          </div>

          {/* Timesheet and Billable Checkboxes */}
          {eventType !== 'timeblock' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={isTimesheet}
                  onChange={(e) => setIsTimesheet(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#0066FF'
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                  Timesheet
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  — Include in your submitted work hours
                </span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={isBillable}
                  onChange={(e) => setIsBillable(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#0066FF'
                  }}
                />
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#0A0A0A' }}>
                  Billable
                </span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  — Track as billable time for client invoicing
                </span>
              </label>
            </div>
          )}

          {/* Info Message */}
          {infoMessage && (
            <div style={{
              padding: '12px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <Info size={16} color="#0066FF" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '12px', color: '#1E40AF' }}>
                {infoMessage}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            style={{
              padding: '0',
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 500,
              color: '#0066FF',
              cursor: 'pointer'
            }}
          >
            {showMoreOptions ? 'Less options' : 'More options'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: 'white',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0A0A0A',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || isSaving}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: title.trim() && !isSaving ? '#0066FF' : '#E5E7EB',
                fontSize: '13px',
                fontWeight: 500,
                color: title.trim() && !isSaving ? 'white' : '#9CA3AF',
                cursor: title.trim() && !isSaving ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
