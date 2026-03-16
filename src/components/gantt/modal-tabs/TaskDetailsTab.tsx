import React, { useState, useMemo } from 'react';
import { Calendar, Clock, Flag, CheckSquare, Tag, X } from 'lucide-react';
import { useProjectsSummary, useAllTasks } from '../../../hooks/useApiQueries';
import type { Task } from '../../../types/task';

// Extended task type for details tab (includes modal-specific fields)
interface DetailsTask extends Partial<Task> {
  id: string;
  name: string;
  progress?: number;
  flag?: boolean;
  _isNew?: boolean;
  checklist?: Array<{ id: string; label?: string; text?: string; completed: boolean }>;
  alertStatus?: string;
  selectedLabels?: string[];
  skills?: string[];
  expertise?: string;
  estimation?: string;
  project?: string;
  activity?: string;
}

interface TaskDetailsTabProps {
  task: DetailsTask;
  onUpdate: (updates: Partial<DetailsTask>) => void;
}

export function TaskDetailsTab({ task, onUpdate }: TaskDetailsTabProps) {
  const [importance, setImportance] = useState(task.importance || 50);
  const [progress, setProgress] = useState(task.progress || 0);
  const [checklistItems, setChecklistItems] = useState(task.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const [tags, setTags] = useState(task.tags || task.labels || []);

  // Check if this is a new task being created (from conversion or new project task)
  const isNewTask = task._isNew === true;
  
  // Get the owner from participants (isOwner: true)
  const owner = task.participants?.find((p: any) => p.isOwner) || task.participants?.[0] || null;
  const ownerName = owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'Unassigned';
  const ownerInitials = owner ? `${owner.firstName?.charAt(0) || ''}${owner.lastName?.charAt(0) || ''}`.toUpperCase() : '?';
  
  // Format dates for display (DD/MM/YY)
  const formatDateForDisplay = (dateStr: string | undefined): string => {
    if (!dateStr) return 'Select date';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Select date';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch {
      return 'Select date';
    }
  };
  
  const fromDate = formatDateForDisplay(task.startDate);
  const toDate = formatDateForDisplay(task.endDate);

  // Dropdown state management
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [showExpertiseDropdown, setShowExpertiseDropdown] = useState(false);
  const [showEstimationDropdown, setShowEstimationDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  // Selected values
  const [selectedProject, setSelectedProject] = useState(task.project || null);
  const [selectedActivity, setSelectedActivity] = useState(task.activity || null);
  const [selectedAlert, setSelectedAlert] = useState(task.alertStatus || null);
  const [selectedLabels, setSelectedLabels] = useState(task.selectedLabels || []);
  const [selectedSkills, setSelectedSkills] = useState(task.skills || []);
  const [selectedExpertise, setSelectedExpertise] = useState(task.expertise || null);
  const [selectedEstimation, setSelectedEstimation] = useState(task.estimation || null);

  // Dropdown options data via TanStack Query
  const { data: projectsData = [] } = useProjectsSummary();
  const projects = useMemo(() => projectsData.map((p: any) => ({ id: p.id, name: p.name })), [projectsData]);
  const { data: allTasksData = [] } = useAllTasks();
  const activities = useMemo(() => {
    if (!selectedProject) return [];
    const projectTasks = allTasksData.filter(
      (t: any) => t.activity?.project?.name === selectedProject || t.activity?.project?.id === selectedProject
    );
    const activityMap = new Map<string, string>();
    projectTasks.forEach((t: any) => {
      if (t.activity?.id && t.activity?.name) {
        activityMap.set(t.activity.id, t.activity.name);
      }
    });
    return Array.from(activityMap, ([id, name]) => ({ id, name }));
  }, [selectedProject]);

  const alertStatuses = [
    { id: 'as1', name: 'On Track', color: '#10B981' },
    { id: 'as2', name: 'At Risk', color: '#F59E0B' },
    { id: 'as3', name: 'Delayed', color: '#EF4444' },
    { id: 'as4', name: 'Blocked', color: '#DC2626' },
    { id: 'as5', name: 'Completed', color: '#3B82F6' }
  ];

  const labelOptions = [
    { id: 'lb1', name: 'High Priority' },
    { id: 'lb2', name: 'Critical' },
    { id: 'lb3', name: 'Enhancement' },
    { id: 'lb4', name: 'Bug Fix' },
    { id: 'lb5', name: 'Feature' },
    { id: 'lb6', name: 'Research' },
    { id: 'lb7', name: 'Documentation' }
  ];

  const skillOptions = [
    { id: 'sk1', name: 'React' },
    { id: 'sk2', name: 'TypeScript' },
    { id: 'sk3', name: 'Node.js' },
    { id: 'sk4', name: 'Python' },
    { id: 'sk5', name: 'PostgreSQL' },
    { id: 'sk6', name: 'AWS' },
    { id: 'sk7', name: 'Docker' },
    { id: 'sk8', name: 'UI/UX Design' }
  ];

  const expertiseOptions = [
    { id: 'ex1', name: 'Junior' },
    { id: 'ex2', name: 'Intermediate' },
    { id: 'ex3', name: 'Senior' },
    { id: 'ex4', name: 'Expert' }
  ];

  const estimationOptions = [
    { id: 'est1', name: 'XS (1-2 hours)' },
    { id: 'est2', name: 'S (2-4 hours)' },
    { id: 'est3', name: 'M (4-8 hours)' },
    { id: 'est4', name: 'L (1-2 days)' },
    { id: 'est5', name: 'XL (2-5 days)' },
    { id: 'est6', name: 'XXL (1-2 weeks)' }
  ];

  // Available tags from board (this would come from props in real implementation)
  const availableTags = [
    { id: 'l1', name: 'Design', color: '#968fe5' },
    { id: 'l2', name: 'Backend', color: '#34D399' },
    { id: 'l3', name: 'Frontend', color: '#60A5FA' },
    { id: 'l4', name: 'Testing', color: '#ffbd01' },
    { id: 'l5', name: 'Documentation', color: '#00b4cd' },
    { id: 'l6', name: 'Bug', color: '#F87171' },
    { id: 'l7', name: 'Enhancement', color: '#00d400' },
    { id: 'l9', name: 'High Priority', color: '#ff4f6a' },
    { id: 'l8', name: 'Urgent', color: '#F87171' }
  ];

  const addTag = (tag: any) => {
    if (!tags.find((t: any) => t.id === tag.id)) {
      const newTags = [...tags, tag];
      setTags(newTags);
      onUpdate({ tags: newTags });
    }
    setShowTagDropdown(false);
  };

  const removeTag = (tagId: string) => {
    const newTags = tags.filter((t: any) => t.id !== tagId);
    setTags(newTags);
    onUpdate({ tags: newTags });
  };

  const toggleChecklistItem = (itemId: string) => {
    const updatedChecklist = checklistItems.map((item: any) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklistItems(updatedChecklist);
    onUpdate({ checklist: updatedChecklist });
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem = {
        id: `checklist-${Date.now()}`,
        label: newChecklistItem.trim(),
        completed: false
      };
      const updatedChecklist = [...checklistItems, newItem];
      setChecklistItems(updatedChecklist);
      onUpdate({ checklist: updatedChecklist });
      setNewChecklistItem('');
    }
  };

  const handleChecklistKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChecklistItem();
    }
  };

  const getChecklistProgress = () => {
    if (!checklistItems || checklistItems.length === 0) return { completed: 0, total: 0 };
    const completed = checklistItems.filter((item: any) => item.completed).length;
    return { completed, total: checklistItems.length };
  };

  const getImportanceColor = (value: number) => {
    if (value < 33) return '#10B981';
    if (value < 66) return '#F59E0B';
    return '#DC2626';
  };

  const getImportanceLabel = (value: number) => {
    if (value < 33) return 'Low';
    if (value < 66) return 'Medium';
    return 'High';
  };

  return (
    <div style={{
      maxWidth: '100%'
    }}>
      {/* Compact Single Column Layout */}
      <div>
        {/* Section 1: Basic Information - Compact */}
        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Project
          </label>
          <div style={{
            height: '36px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: isNewTask ? '#9CA3AF' : '#0A0A0A',
            cursor: 'pointer'
          }}
          onClick={() => setShowProjectDropdown(!showProjectDropdown)}
          >
            <span>{isNewTask ? 'Select project...' : task.projectName || task.project || 'Select project...'}</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>▼</span>
          </div>
          {showProjectDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                onClick={() => setShowProjectDropdown(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '200px',
                maxWidth: '320px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #E5E7EB',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Select Project
                </div>
                <div style={{
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}>
                  {projects.map((project: any) => (
                    <div
                      key={project.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        transition: 'background 100ms ease'
                      }}
                      onClick={() => {
                        setSelectedProject(project.name);
                        onUpdate({ project: project.name });
                        setShowProjectDropdown(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{
                        fontSize: '13px',
                        color: '#1F2937',
                        fontWeight: 500
                      }}>
                        {project.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ marginBottom: '12px', position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Activity
          </label>
          <div style={{
            height: '36px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            padding: '0 12px 0 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: isNewTask ? '#9CA3AF' : '#0A0A0A',
            cursor: 'pointer'
          }}
          onClick={() => setShowActivityDropdown(!showActivityDropdown)}
          >
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              paddingRight: '8px',
              display: 'block'
            }}>
              {isNewTask ? 'Select activity...' : task.activityName || task.activity || 'Select activity...'}
            </span>
            <span style={{ fontSize: '12px', color: '#9CA3AF', flexShrink: 0 }}>▼</span>
          </div>
          {showActivityDropdown && (
            <>
              {/* Backdrop to close dropdown */}
              <div
                onClick={() => setShowActivityDropdown(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '200px',
                maxWidth: '320px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #E5E7EB',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Select Activity
                </div>
                <div style={{
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}>
                  {activities.map((activity: any) => (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        cursor: 'pointer',
                        transition: 'background 100ms ease'
                      }}
                      onClick={() => {
                        setSelectedActivity(activity.name);
                        onUpdate({ activity: activity.name });
                        setShowActivityDropdown(false);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{
                        fontSize: '13px',
                        color: '#1F2937',
                        fontWeight: 500
                      }}>
                        {activity.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Section 2: Timeline & Resources - 2-Column Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              From
            </label>
            <div style={{
              height: '36px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              padding: '0 10px 0 32px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: isNewTask ? '#9CA3AF' : '#0A0A0A',
              position: 'relative'
            }}>
              <Calendar size={14} color="#6B7280" style={{
                position: 'absolute',
                left: '10px'
              }} />
              <span>{isNewTask ? 'Select date' : fromDate}</span>
            </div>
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              To
            </label>
            <div style={{
              height: '36px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              padding: '0 10px 0 32px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: isNewTask ? '#9CA3AF' : '#0A0A0A',
              position: 'relative'
            }}>
              <Calendar size={14} color="#6B7280" style={{
                position: 'absolute',
                left: '10px'
              }} />
              <span>{isNewTask ? 'Select date' : toDate}</span>
            </div>
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Estimated Hours
            </label>
            <div style={{
              height: '36px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <input
                type="number"
                min="0"
                step="0.5"
                value={isNewTask ? '' : (task.availableHours || task.plannedHours || '')}
                onChange={(e) => onUpdate({ availableHours: e.target.value })}
                placeholder={isNewTask ? '0' : undefined}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  color: '#0A0A0A',
                  flex: 1,
                  background: 'transparent',
                  width: '50px'
                }}
              />
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>hours</span>
            </div>
          </div>
        </div>

        {/* Section 3: Progress - Compact */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <label style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Progress
            </label>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#3B82F6'
            }}>
              {progress}%
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              height: '6px',
              background: '#F0F0F0',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: '#3B82F6',
                transition: 'width 200ms ease'
              }} />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setProgress(value);
                onUpdate({ progress: value });
              }}
              style={{
                position: 'absolute',
                width: '100%',
                height: '16px',
                top: '-5px',
                opacity: 0,
                cursor: 'grab',
                zIndex: 2
              }}
            />
            <div style={{
              position: 'absolute',
              left: `${progress}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '14px',
              height: '14px',
              background: '#3B82F6',
              border: '2px solid white',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(59,130,246,0.4)',
              pointerEvents: 'none'
            }} />
          </div>
        </div>

        {/* Section 4: Importance - Compact */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Importance
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'relative',
              height: '6px',
              background: 'linear-gradient(to right, #10B981 0%, #F59E0B 50%, #DC2626 100%)',
              borderRadius: '3px',
              marginBottom: '4px'
            }}>
              <input
                type="range"
                min="0"
                max="100"
                value={importance}
                onChange={(e) => setImportance(parseInt(e.target.value))}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '20px',
                  top: '-7px',
                  opacity: 0,
                  cursor: 'grab',
                  zIndex: 2
                }}
              />
              <div style={{
                position: 'absolute',
                left: `${importance}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '18px',
                height: '18px',
                background: 'white',
                border: `3px solid ${getImportanceColor(importance)}`,
                borderRadius: '50%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                pointerEvents: 'none'
              }} />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#9CA3AF'
            }}>
              <span>Low</span>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: getImportanceColor(importance)
              }}>
                {getImportanceLabel(importance)}
              </span>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* Section 5: Alert & Checkboxes - Side by Side */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ position: 'relative' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Alert Status
            </label>
            <div style={{
              height: '36px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              padding: '0 10px 0 28px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: '#9CA3AF',
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => setShowAlertDropdown(!showAlertDropdown)}
            >
              <div style={{
                position: 'absolute',
                left: '10px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10B981'
              }} />
              <span style={{ fontSize: '13px' }}>Select...</span>
              <span style={{
                marginLeft: 'auto',
                fontSize: '12px',
                color: '#9CA3AF'
              }}>▼</span>
            </div>
            {showAlertDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  onClick={() => setShowAlertDropdown(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  maxWidth: '320px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Select Alert Status
                  </div>
                  <div style={{
                    maxHeight: '240px',
                    overflowY: 'auto'
                  }}>
                    {alertStatuses.map((status: any) => (
                      <div
                        key={status.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'background 100ms ease'
                        }}
                        onClick={() => {
                          setSelectedAlert(status.name);
                          onUpdate({ alertStatus: status.name });
                          setShowAlertDropdown(false);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: status.color,
                            flexShrink: 0
                          }}
                        />
                        <span style={{
                          fontSize: '13px',
                          color: '#1F2937',
                          fontWeight: 500
                        }}>
                          {status.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Options
            </label>
            <div style={{
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '13px', color: '#0A0A0A' }}>Billable</span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '13px', color: '#0A0A0A' }}>Time</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 6: Assigned To - Compact */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Assigned to
          </label>
          <div style={{
            height: '48px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white'
              }}>
                {ownerInitials}
              </div>
              <div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#0A0A0A'
                }}>
                  {ownerName}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#6B7280'
                }}>
                  Owner
                </div>
              </div>
            </div>
            <button style={{
              height: '28px',
              padding: '0 10px',
              border: '1px solid #3B82F6',
              borderRadius: '6px',
              background: 'white',
              color: '#3B82F6',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              Change
            </button>
          </div>
        </div>

        {/* Section 7: Classification - Compact 2x2 Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '12px'
        }}>
          {['Labels', 'Skills', 'Expertise', 'Estimation'].map((field) => (
            <div key={field} style={{ position: 'relative' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: '#6B7280',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {field}
              </label>
              <div style={{
                height: '36px',
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '13px',
                color: '#9CA3AF',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (field === 'Labels') setShowLabelsDropdown(!showLabelsDropdown);
                if (field === 'Skills') setShowSkillsDropdown(!showSkillsDropdown);
                if (field === 'Expertise') setShowExpertiseDropdown(!showExpertiseDropdown);
                if (field === 'Estimation') setShowEstimationDropdown(!showEstimationDropdown);
              }}
              >
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>Select...</span>
                <span style={{
                  fontSize: '11px',
                  marginLeft: '4px'
                }}>▼</span>
              </div>
              {field === 'Labels' && showLabelsDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    onClick={() => setShowLabelsDropdown(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '200px',
                    maxWidth: '320px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Select Labels
                    </div>
                    <div style={{
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {labelOptions.map((label: any) => (
                        <div
                          key={label.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            transition: 'background 100ms ease'
                          }}
                          onClick={() => {
                            if (!selectedLabels.includes(label.name)) {
                              setSelectedLabels([...selectedLabels, label.name]);
                              onUpdate({ selectedLabels: [...selectedLabels, label.name] });
                            }
                            setShowLabelsDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{
                            fontSize: '13px',
                            color: '#1F2937',
                            fontWeight: 500
                          }}>
                            {label.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {field === 'Skills' && showSkillsDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    onClick={() => setShowSkillsDropdown(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '200px',
                    maxWidth: '320px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Select Skills
                    </div>
                    <div style={{
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {skillOptions.map((skill: any) => (
                        <div
                          key={skill.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            transition: 'background 100ms ease'
                          }}
                          onClick={() => {
                            if (!selectedSkills.includes(skill.name)) {
                              setSelectedSkills([...selectedSkills, skill.name]);
                              onUpdate({ skills: [...selectedSkills, skill.name] });
                            }
                            setShowSkillsDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{
                            fontSize: '13px',
                            color: '#1F2937',
                            fontWeight: 500
                          }}>
                            {skill.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {field === 'Expertise' && showExpertiseDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    onClick={() => setShowExpertiseDropdown(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '200px',
                    maxWidth: '320px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Select Expertise
                    </div>
                    <div style={{
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {expertiseOptions.map((expertise: any) => (
                        <div
                          key={expertise.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            transition: 'background 100ms ease'
                          }}
                          onClick={() => {
                            setSelectedExpertise(expertise.name);
                            onUpdate({ expertise: expertise.name });
                            setShowExpertiseDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{
                            fontSize: '13px',
                            color: '#1F2937',
                            fontWeight: 500
                          }}>
                            {expertise.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {field === 'Estimation' && showEstimationDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    onClick={() => setShowEstimationDropdown(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 999
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '200px',
                    maxWidth: '320px',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Select Estimation
                    </div>
                    <div style={{
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}>
                      {estimationOptions.map((estimation: any) => (
                        <div
                          key={estimation.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            transition: 'background 100ms ease'
                          }}
                          onClick={() => {
                            setSelectedEstimation(estimation.name);
                            onUpdate({ estimation: estimation.name });
                            setShowEstimationDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{
                            fontSize: '13px',
                            color: '#1F2937',
                            fontWeight: 500
                          }}>
                            {estimation.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Tags Section */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <label style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Tag size={14} color="#60A5FA" />
              Tags
            </label>
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: 500,
                color: '#0066FF',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Add Tag
            </button>
          </div>
          
          {/* Tags Display - Pill Style */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            minHeight: tags.length === 0 ? '44px' : 'auto',
            alignItems: tags.length === 0 ? 'center' : 'flex-start',
            position: 'relative'
          }}>
            {tags.length === 0 ? (
              <span style={{
                fontSize: '13px',
                color: '#9CA3AF',
                fontStyle: 'italic'
              }}>
                No tags added
              </span>
            ) : (
              tags.map((tag: any) => (
                <div
                  key={tag.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#F3F4F6',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    padding: '6px 10px 6px 8px',
                    fontSize: '13px',
                    color: '#1F2937'
                  }}
                >
                  {/* Colored dot indicator */}
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: tag.color,
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontWeight: 500 }}>
                    {tag.name}
                  </span>
                  <button
                    onClick={() => removeTag(tag.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#9CA3AF',
                      marginLeft: '2px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                    title="Remove tag"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
            
            {/* Tag Dropdown */}
            {showTagDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  onClick={() => setShowTagDropdown(false)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 999
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '200px',
                  maxWidth: '320px',
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #E5E7EB',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Select Tag
                  </div>
                  <div style={{
                    maxHeight: '240px',
                    overflowY: 'auto'
                  }}>
                    {availableTags
                      .filter((tag: any) => !tags.find((t: any) => t.id === tag.id))
                      .map((tag: any) => (
                        <div
                          key={tag.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            transition: 'background 100ms ease'
                          }}
                          onClick={() => addTag(tag)}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div
                            style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              background: tag.color,
                              flexShrink: 0
                            }}
                          />
                          <span style={{
                            fontSize: '13px',
                            color: '#1F2937',
                            fontWeight: 500
                          }}>
                            {tag.name}
                          </span>
                        </div>
                      ))}
                    {availableTags.filter((tag: any) => !tags.find((t: any) => t.id === tag.id)).length === 0 && (
                      <div style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        fontSize: '13px',
                        color: '#9CA3AF',
                        fontStyle: 'italic'
                      }}>
                        All tags added
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Checklist Section - Only show if checklist exists */}
        {checklistItems && checklistItems.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckSquare size={14} color="#60A5FA" />
                Checklist
              </label>
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#60A5FA'
              }}>
                {getChecklistProgress().completed} / {getChecklistProgress().total}
              </span>
            </div>
            <div style={{
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              padding: '8px 12px'
            }}>
              {checklistItems.map((item: any, index: number) => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 0',
                    borderBottom: index < checklistItems.length - 1 ? '1px solid #E5E7EB' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklistItem(item.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      accentColor: '#60A5FA',
                      flexShrink: 0
                    }}
                  />
                  <span style={{
                    fontSize: '13px',
                    color: item.completed ? '#9CA3AF' : '#0A0A0A',
                    textDecoration: item.completed ? 'line-through' : 'none',
                    flex: 1
                  }}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Add New Checklist Item */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckSquare size={14} color="#60A5FA" />
            <input
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyPress={handleChecklistKeyPress}
              placeholder="Add checklist item..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#0A0A0A',
                fontFamily: 'inherit',
                outline: 'none'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            />
            <button
              onClick={addChecklistItem}
              style={{
                background: '#60A5FA',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 150ms ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#3B82F6'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#60A5FA'}
            >
              Add
            </button>
          </div>
        </div>

        {/* Section 8: Description - Compact */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            color: '#6B7280',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Description
          </label>
          <textarea
            placeholder="Add task description..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '10px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#0A0A0A',
              lineHeight: '1.5',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
          />
        </div>

        {/* Flag Indicator if present */}
        {task.flag && (
          <div style={{
            height: '44px',
            background: '#FFF7ED',
            border: '1px solid #F97316',
            borderLeft: '3px solid #F97316',
            borderRadius: '6px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '12px'
          }}>
            <Flag size={16} color="#F97316" />
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#F97316'
              }}>
                Flagged
              </span>
              <span style={{
                fontSize: '12px',
                color: '#EA580C',
                marginLeft: '8px'
              }}>
                1 active flag
              </span>
            </div>
            <button style={{
              background: 'transparent',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              color: '#F97316',
              cursor: 'pointer'
            }}>
              View →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}