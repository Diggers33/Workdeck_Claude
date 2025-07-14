import React, { useState, useEffect } from 'react';
import { Calendar, Users, AlertTriangle, RefreshCw, Settings, Clock, Key } from 'lucide-react';

const ResourcePlanner = () => {
  const [showTaskDetails, setShowTaskDetails] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [selectedView, setSelectedView] = useState('week');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState(null);
  const [showSpreadsheetView, setShowSpreadsheetView] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [showPhaseTemplates, setShowPhaseTemplates] = useState(false);
  const [selectedMemberForTemplate, setSelectedMemberForTemplate] = useState(null);
  const [spreadsheetView, setSpreadsheetView] = useState('month');
  
  // Live data from Workdeck
  const [teamData, setTeamData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Authentication token - GitHub Pages compatible
  const [authToken, setAuthToken] = useState(() => {
    // Only use localStorage for GitHub Pages deployment
    return localStorage.getItem('workdeck_token') || '';
  });

  const WORKDECK_BASE_URL = 'https://test-api.workdeck.com';

  // Check if token is available on mount
  useEffect(() => {
    if (!authToken) {
      setShowTokenModal(true);
      setLoading(false);
      setError('Authentication token required. Please set your Workdeck token.');
    }
  }, [authToken]);

  // API Functions
  const fetchWithAuth = async (endpoint, options = {}) => {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${WORKDECK_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your token.');
      }
      if (response.status === 403) {
        throw new Error('Access denied. You may not have permission to access this resource.');
      }
      if (response.status === 404) {
        throw new Error('Resource not found. The requested endpoint may not exist.');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const fetchUsers = async () => {
    try {
      const data = await fetchWithAuth('/queries/users');
      return data.result || data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await fetchWithAuth('/queries/projects-summary');
      return data.result || data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  };

  const fetchOffices = async () => {
    try {
      const data = await fetchWithAuth('/queries/offices');
      return data.result || data;
    } catch (error) {
      console.error('Error fetching offices:', error);
      throw error;
    }
  };

  const fetchMyUser = async () => {
    try {
      const data = await fetchWithAuth('/queries/me');
      return data.result || data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  };

  // Transform Workdeck data to our component format
  const transformUserToTeamMember = (user, userProjects = [], offices = []) => {
    let weeklyCapacity = 40;
    
    if (user.office?.id && offices.length > 0) {
      const userOffice = offices.find(office => office.id === user.office.id);
      if (userOffice?.timeTables?.length > 0) {
        const mainTimetable = userOffice.timeTables.find(tt => tt.isMain) || userOffice.timeTables[0];
        if (mainTimetable?.dayHours) {
          weeklyCapacity = parseFloat(mainTimetable.dayHours) * 5;
        }
      }
    }

    const tasks = userProjects.map((project, index) => {
      const projectId = project.name?.toLowerCase().replace(/\s+/g, '-') || `project-${project.id}`;
      
      const projectTotalHours = project.plannedHours || project.availableHours || 0;
      const projectDurationWeeks = calculateProjectDurationWeeks(project);
      const targetWeeklyHours = projectDurationWeeks > 0 ? projectTotalHours / projectDurationWeeks : 0;
      
      return {
        id: `${user.id}-${project.id}-${index}`,
        project: project.name || 'Unnamed Project',
        activity: project.activities?.[0]?.name || 'General Work',
        task: project.activities?.[0]?.tasks?.[0]?.name || project.code || 'Project Tasks',
        color: getProjectColor(project.id || index),
        estimatedHours: projectTotalHours,
        actualHours: 0,
        totalActivityHours: project.activities?.[0]?.availableHours || projectTotalHours,
        totalProjectHours: projectTotalHours,
        velocity: 0,
        status: getProjectStatus(project),
        startWeek: calculateProjectStartWeek(project),
        endWeek: calculateProjectEndWeek(project),
        pattern: generateWorkPattern(),
        isLongTerm: isLongTermProject(project),
        targetHoursPerWeek: Math.min(targetWeeklyHours, weeklyCapacity * 0.6),
        duration: calculateDuration(project),
        projectId,
        monthlyHours: Array.from({ length: 12 }, () => Math.min(targetWeeklyHours, weeklyCapacity * 0.6))
      };
    });

    const scheduledHours = tasks.reduce((sum, task) => sum + (task.targetHoursPerWeek || 0), 0);
    const utilization = Math.round((scheduledHours / weeklyCapacity) * 100);

    return {
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      avatar: user.avatar || getAvatarForUser(user),
      department: user.department || 'Unknown',
      capacity: weeklyCapacity,
      scheduled: Math.round(scheduledHours * 10) / 10,
      utilization,
      role: user.rol || 'Team Member',
      office: user.office?.name || 'Remote',
      tasks
    };
  };

  // Helper functions
  const getProjectColor = (projectId) => {
    const colors = [
      'bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-red-600', 
      'bg-yellow-600', 'bg-indigo-600', 'bg-pink-600', 'bg-teal-600',
      'bg-orange-600', 'bg-cyan-600', 'bg-lime-600', 'bg-violet-600'
    ];
    const hash = projectId?.toString().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getProjectStatus = (project) => {
    if (project.isDraft) return 'planned';
    if (project.endDate && new Date(project.endDate) < new Date()) return 'completed';
    if (project.startDate && new Date(project.startDate) > new Date()) return 'planned';
    return 'in-progress';
  };

  const isLongTermProject = (project) => {
    const totalHours = project.plannedHours || project.availableHours || 0;
    const durationWeeks = calculateProjectDurationWeeks(project);
    return totalHours > 200 || durationWeeks > 12;
  };

  const calculateProjectDurationWeeks = (project) => {
    if (project.startDate && project.endDate) {
      const start = new Date(project.startDate);
      const end = new Date(project.endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7));
    }
    return 12;
  };

  const calculateProjectStartWeek = (project) => {
    if (project.startDate) {
      const start = new Date(project.startDate);
      const now = new Date();
      const weeksDiff = Math.floor((start - now) / (1000 * 60 * 60 * 24 * 7));
      return weeksDiff;
    }
    return -4;
  };

  const calculateProjectEndWeek = (project) => {
    if (project.endDate) {
      const end = new Date(project.endDate);
      const now = new Date();
      const weeksDiff = Math.floor((end - now) / (1000 * 60 * 60 * 24 * 7));
      return weeksDiff;
    }
    return 20;
  };

  const calculateDuration = (project) => {
    const weeks = calculateProjectDurationWeeks(project);
    const months = Math.ceil(weeks / 4.33);
    
    if (months > 1) {
      return `${months} months`;
    } else if (weeks > 1) {
      return `${weeks} weeks`;
    }
    return 'TBD';
  };

  const generateWorkPattern = () => {
    return [true, true, true, true, true, false, false, true, true];
  };

  const getAvatarForUser = (user) => {
    const avatars = ['👨‍💻', '👩‍💻', '👨‍🔬', '👩‍🔬', '👨‍💼', '👩‍💼', '👨‍🎨', '👩‍🎨'];
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (name.length > 0) {
      const hash = name.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return avatars[Math.abs(hash) % avatars.length];
    }
    return '👤';
  };

  // Load data from Workdeck
  const loadWorkdeckData = async () => {
    if (!authToken) {
      setError('No authentication token found. Please set your Workdeck token.');
      setLoading(false);
      setShowTokenModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading Workdeck data...');

      const [users, projects, offices, currentUser] = await Promise.all([
        fetchUsers(),
        fetchProjects(),
        fetchOffices(),
        fetchMyUser().catch(() => null)
      ]);

      console.log('Workdeck Data loaded:', { 
        users: users?.length || 0, 
        projects: projects?.length || 0, 
        offices: offices?.length || 0,
        currentUser: currentUser?.id || 'not available'
      });

      const uniqueDepts = [...new Set(users
        .map(user => user.department)
        .filter(dept => dept && dept.trim() !== ''))];
      
      if (uniqueDepts.length === 0) {
        uniqueDepts.push('General');
      }
      
      setDepartments(uniqueDepts);

      const transformedTeam = users.map(user => {
        const userProjects = projects.filter(project => {
          if (project.members?.some(member => member.user?.id === user.id)) {
            return true;
          }
          if (project.activities?.some(activity => 
            activity.tasks?.some(task =>
              task.participants?.some(participant => participant.user?.id === user.id)
            )
          )) {
            return true;
          }
          return false;
        });
        
        return transformUserToTeamMember(user, userProjects, offices);
      });

      const validTeam = transformedTeam.filter(member => 
        member.name && member.name.trim() !== '' && member.name !== 'Unknown User'
      );

      console.log('Transformed team data:', validTeam.length, 'valid members');

      setTeamData(validTeam);
      setProjects(projects);
      setLastSync(new Date());
      setLoading(false);

    } catch (error) {
      console.error('Error loading Workdeck data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadWorkdeckData();
    }
  }, [authToken]);

  // Create new task in Workdeck
  const createWorkdeckTask = async (taskData) => {
    try {
      const response = await fetchWithAuth('/commands/sync/create-task', {
        method: 'POST',
        body: JSON.stringify({
          name: taskData.name,
          project: { id: taskData.projectId },
          plannedHours: taskData.estimatedHours.toString(),
          importance: taskData.priority || 2,
          participants: [{
            user: { id: taskData.userId },
            isOwner: true,
            plannedHours: taskData.estimatedHours.toString(),
            percentage: 100
          }]
        })
      });

      console.log('Task created in Workdeck:', response);
      await loadWorkdeckData();
      return response;
    } catch (error) {
      console.error('Error creating task in Workdeck:', error);
      throw error;
    }
  };

  const updateTaskHours = async (taskId, hours) => {
    try {
      console.log('Would update task hours in Workdeck:', taskId, hours);
    } catch (error) {
      console.error('Error updating task hours:', error);
    }
  };

  // Handle token setup
  const handleTokenSubmit = (token) => {
    if (token.trim()) {
      localStorage.setItem('workdeck_token', token.trim());
      setAuthToken(token.trim());
      setShowTokenModal(false);
      setError(null);
    }
  };

  // Show token setup modal if no token
  if (showTokenModal || (!authToken && !loading)) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Workdeck Authentication</h2>
            <p className="text-gray-600 text-sm">Enter your Workdeck API token to access live data</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleTokenSubmit(formData.get('token'));
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workdeck API Token
                </label>
                <input
                  type="password"
                  name="token"
                  required
                  placeholder="Enter your bearer token..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="text-xs text-blue-800">
                  <strong>How to get your token:</strong>
                  <ol className="mt-1 ml-4 list-decimal space-y-1">
                    <li>Log into your Workdeck account</li>
                    <li>Go to Settings → API or Developer section</li>
                    <li>Generate or copy your bearer token</li>
                    <li>Paste it above</li>
                  </ol>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {error}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Connect to Workdeck
              </button>
            </div>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <div className="mb-1">🔒 Your token is stored securely in your browser</div>
              <div>🌐 Connecting to: {WORKDECK_BASE_URL}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4">
            <RefreshCw className="w-12 h-12" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Workdeck Data...</h2>
          <p className="text-gray-600">Fetching users, projects, and scheduling information</p>
          <div className="mt-4 text-xs text-gray-500">
            Connecting to: {WORKDECK_BASE_URL}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button 
              onClick={loadWorkdeckData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
            <button 
              onClick={() => setShowTokenModal(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center space-x-2 mx-auto"
            >
              <Key className="w-4 h-4" />
              <span>Update Token</span>
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            API Base URL: {WORKDECK_BASE_URL}
          </div>
        </div>
      </div>
    );
  }

  // Filter team members by department
  const filteredTeamMembers = teamData.filter(member => 
    selectedDepartment === 'all' || member.department === selectedDepartment
  );

  // Navigation functions
  const goToPreviousWeek = () => setCurrentWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setCurrentWeekOffset(prev => prev + 1);
  const goToToday = () => setCurrentWeekOffset(0);

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100 border-green-200';
      case 'in-progress': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'over-budget': return 'text-red-700 bg-red-100 border-red-200';
      case 'planned': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRemainingHours = (task) => Math.max(0, task.estimatedHours - task.actualHours);

  const getUtilizationColor = (utilization) => {
    if (utilization > 100) return 'text-red-600 bg-red-50 border-red-200';
    if (utilization > 85) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (utilization < 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const handleAssignTask = (member) => {
    setSelectedMemberForAssignment(member);
    setShowAssignTaskModal(true);
  };

  const submitTaskAssignment = async (taskData) => {
    try {
      await createWorkdeckTask({
        ...taskData,
        userId: selectedMemberForAssignment.id
      });
      
      setShowAssignTaskModal(false);
      setSelectedMemberForAssignment(null);
    } catch (error) {
      alert('Error creating task: ' + error.message);
    }
  };

  const handleTaskClick = (task, member) => {
    setSelectedTask({
      ...task,
      memberName: member.name,
      memberDepartment: member.department,
      memberRole: member.role
    });
  };

  const getDateRangeLabel = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    if (selectedView === 'year') return currentYear.toString();
    if (selectedView === 'quarter') {
      const quarterNumber = Math.floor(currentMonth / 3) + 1;
      const quarterMonths = [
        ['Jan', 'Feb', 'Mar'],
        ['Apr', 'May', 'Jun'], 
        ['Jul', 'Aug', 'Sep'],
        ['Oct', 'Nov', 'Dec']
      ];
      return `Q${quarterNumber} ${currentYear} (${quarterMonths[quarterNumber - 1].join('-')})`;
    }
    if (selectedView === 'month') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[currentMonth]} ${currentYear}`;
    }
    
    const weekStart = currentDay - currentDate.getDay() + (currentWeekOffset * 7);
    const weekEnd = weekStart + 6;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (currentWeekOffset === 0) {
      return `${monthNames[currentMonth]} ${weekStart}-${Math.min(weekEnd, 30)}, ${currentYear}`;
    }
    return `${monthNames[currentMonth]} ${weekStart}-${Math.min(weekEnd, 30)}, ${currentYear} (${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset})`;
  };

  return (
    <div className="bg-gray-50 min-h-screen" style={{ 
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", sans-serif',
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-semibold text-gray-900" style={{ fontWeight: '600' }}>
              Workdeck Resource Planner
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{getDateRangeLabel()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700">GitHub Pages</span>
            </div>

            {/* Token Management */}
            <button 
              onClick={() => setShowTokenModal(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded border border-gray-300"
              title="Update Workdeck token"
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Last Sync Time */}
            {lastSync && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Synced {lastSync.toLocaleTimeString()}</span>
              </div>
            )}

            {/* Refresh Button */}
            <button 
              onClick={loadWorkdeckData}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded border border-gray-300"
              title="Refresh data from Workdeck"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Navigation Controls */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-md">
              <button onClick={goToPreviousWeek} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-l-md">
                ◀
              </button>
              <button onClick={goToToday} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 hover:bg-gray-50 border-l border-r border-gray-300">
                Today
              </button>
              <button onClick={goToNextWeek} className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-r-md">
                ▶
              </button>
            </div>

            {/* View Controls */}
            <button 
              onClick={() => setShowTaskDetails(!showTaskDetails)} 
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showTaskDetails ? 'Hide Tasks' : 'Show Tasks'}
            </button>

            <select 
              value={selectedView} 
              onChange={(e) => setSelectedView(e.target.value)}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md px-3 py-1.5"
            >
              <option value="week">Week View</option>
              <option value="month">Month View</option>
              <option value="quarter">Quarter View</option>
              <option value="year">Year View</option>
            </select>

            {/* Department Filter */}
            <select 
              value={selectedDepartment} 
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md px-3 py-1.5"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{filteredTeamMembers.length} team members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Info Panel */}
      <div className="p-4">
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 mb-1">Live Workdeck Integration • GitHub Pages</h3>
              <div className="text-xs text-green-800 grid grid-cols-2 gap-x-4 gap-y-1">
                <div>• <strong>Team Members:</strong> {teamData.length} loaded</div>
                <div>• <strong>Projects:</strong> {projects.length} active</div>
                <div>• <strong>Departments:</strong> {departments.length} departments</div>
                <div>• <strong>API:</strong> {WORKDECK_BASE_URL}</div>
                <div>• <strong>Last Sync:</strong> {lastSync ? lastSync.toLocaleTimeString() : 'Never'}</div>
                <div>• <strong>Hosted on:</strong> GitHub Pages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Display */}
        {filteredTeamMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members Found</h3>
            <p className="text-gray-600 mb-4">
              {selectedDepartment === 'all' 
                ? 'No users found in your Workdeck account' 
                : `No users found in the ${selectedDepartment} department`}
            </p>
            <button 
              onClick={loadWorkdeckData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Data</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTeamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-lg border shadow-sm">
                {/* Member Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.department} • {member.role}</div>
                      <div className="text-xs text-gray-500">
                        {member.office} • {member.scheduled}h scheduled / {member.capacity}h capacity
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => handleAssignTask(member)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <span>+</span>
                      <span>Assign Task</span>
                    </button>
                    <div className={`px-3 py-1.5 rounded text-sm font-medium border ${getUtilizationColor(member.utilization)}`}>
                      {member.utilization}%
                      {member.utilization > 100 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </div>
                  </div>
                </div>

                {/* Tasks Section */}
                <div className="p-4">
                  {member.tasks.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Current Tasks ({member.tasks.length})
                      </div>
                      {showTaskDetails && member.tasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => handleTaskClick(task, member)}
                        >
                          <div className={`w-4 h-4 rounded-full ${task.color} flex-shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="font-medium text-sm text-gray-900 truncate">{task.project}</div>
                              {task.isLongTerm && (
                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded border">
                                  Long-term
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mb-1">
                              <span className="font-medium">{task.activity}</span>
                              <span className="text-gray-400 mx-1">→</span>
                              <span>{task.task}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span>
                                <strong>{task.targetHoursPerWeek}h/week</strong> • {task.duration}
                              </span>
                              <span>
                                {task.actualHours}h / {task.estimatedHours}h
                              </span>
                              <span className="text-blue-600">
                                {Math.round((task.actualHours / Math.max(task.estimatedHours, 1)) * 100)}% complete
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-block px-2 py-1 text-xs rounded border ${getTaskStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {!showTaskDetails && (
                        <div className="text-center py-2">
                          <button 
                            onClick={() => setShowTaskDetails(true)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Show {member.tasks.length} task{member.tasks.length !== 1 ? 's' : ''}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <div className="text-sm mb-2">No tasks assigned</div>
                      <button 
                        onClick={() => handleAssignTask(member)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Assign first task →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className={`w-4 h-4 rounded-full ${selectedTask.color} mt-1 flex-shrink-0`}></div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">{selectedTask.project}</h2>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">{selectedTask.activity}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span>{selectedTask.task}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to {selectedTask.memberName} ({selectedTask.memberDepartment})
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">✕</button>
              </div>

              <div className="space-y-4">
                {/* Progress Overview */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded text-center">
                    <div className="text-xs text-blue-700">Estimated</div>
                    <div className="text-sm font-bold text-blue-900">{selectedTask.estimatedHours}h</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded text-center">
                    <div className="text-xs text-green-700">Actual</div>
                    <div className="text-sm font-bold text-green-900">{selectedTask.actualHours}h</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded text-center">
                    <div className="text-xs text-orange-700">Remaining</div>
                    <div className="text-sm font-bold text-orange-900">{getRemainingHours(selectedTask)}h</div>
                  </div>
                </div>

                {/* Weekly Allocation */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium text-gray-900 mb-2">Current Allocation</div>
                  <div className="text-sm text-gray-700">
                    <div>{selectedTask.targetHoursPerWeek}h per week</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Duration: {selectedTask.duration} • 
                      Working pattern: {selectedTask.pattern?.filter(Boolean).length || 5} days/week
                    </div>
                  </div>
                </div>

                {/* Project Context */}
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <div className="text-sm font-medium text-purple-900 mb-1">Project Context</div>
                  <div className="text-xs text-purple-800 space-y-1">
                    <div>Personal task: {selectedTask.actualHours}h / {selectedTask.estimatedHours}h</div>
                    <div>Activity total: {selectedTask.totalActivityHours}h</div>
                    <div>Project total: {selectedTask.totalProjectHours}h</div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded border ${getTaskStatusColor(selectedTask.status)}`}>
                    {selectedTask.status.toUpperCase()}
                  </span>
                  {selectedTask.isLongTerm && (
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded border">
                      Long-term project
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setSelectedTask(null)} 
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Assignment Modal */}
      {showAssignTaskModal && selectedMemberForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAssignTaskModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create Task for {selectedMemberForAssignment.name}</h2>
                <button onClick={() => setShowAssignTaskModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const taskData = {
                  name: formData.get('taskName'),
                  projectId: formData.get('project'),
                  estimatedHours: parseInt(formData.get('estimatedHours')),
                  priority: parseInt(formData.get('priority'))
                };
                submitTaskAssignment(taskData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                    <input 
                      type="text" 
                      name="taskName"
                      required
                      placeholder="Enter descriptive task name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select name="project" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Select Project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} {project.code ? `(${project.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                      <input 
                        type="number" 
                        name="estimatedHours"
                        required 
                        min="1"
                        max="1000"
                        placeholder="40"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select name="priority" required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="1">Low Priority</option>
                        <option value="2" defaultValue>Medium Priority</option>
                        <option value="3">High Priority</option>
                      </select>
                    </div>
                  </div>

                  {/* Capacity Warning */}
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <div className="text-sm font-medium text-gray-700 mb-2">Current Capacity</div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Scheduled: {selectedMemberForAssignment.scheduled}h / {selectedMemberForAssignment.capacity}h</span>
                      <span className={`font-medium ${
                        selectedMemberForAssignment.utilization > 100 ? 'text-red-600' :
                        selectedMemberForAssignment.utilization > 85 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {selectedMemberForAssignment.utilization}% utilized
                      </span>
                    </div>
                    {selectedMemberForAssignment.utilization > 85 && (
                      <div className="mt-2 text-xs text-orange-600 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>This team member is at high capacity</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAssignTaskModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <span>Create in Workdeck</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcePlanner;