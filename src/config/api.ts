/**
 * API Configuration
 * Base URL and common settings for Workdeck API
 */

// Use environment variable or default to test API
const BASE_URL = import.meta.env.VITE_WORKDECK_API_URL || 'https://test-api.workdeck.com';

export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  TOKEN_KEY: 'workdeck-token',
} as const;

export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_ADMIN_LOGIN: '/auth/admin/login',
  AUTH_GOOGLE: '/auth/google',
  AUTH_MICROSOFT: '/auth/microsoft',
  AUTH_FORGOT_PASSWORD: '/commands/sync/forgot-password',
  AUTH_RESET: '/auth/reset',
  AUTH_UPDATE_PASSWORD: '/auth/update-password',
  
  // User
  ME: '/queries/me',
  USERS: '/queries/users',
  USERS_SUMMARY: '/queries/users-summary',
  USERS_WORKING_HOURS: '/queries/users/working-hours',

  // Profile
  MY_PROFILE: '/queries/me/profile',
  UPDATE_MY_PROFILE: '/commands/sync/update-user-profile',

  // Notification Settings
  MY_NOTIFICATION_SETTINGS: '/queries/me/notification-settings',
  UPDATE_NOTIFICATION_SETTINGS: '/commands/sync/update-user-notitication-settings',

  // Calendar Sync
  CALENDAR_GOOGLE_MX_LOOKUP: '/calendar/google/v1/mx-lookup',
  CALENDAR_GOOGLE_AUTH_URL: '/calendar/google/v1/auth-url',
  CALENDAR_GOOGLE_TOKEN: '/calendar/google/v1/token',
  CALENDAR_MICROSOFT_AUTH_URL: '/calendar/microsoft/v1/auth-url',
  CALENDAR_MICROSOFT_TOKEN: '/calendar/microsoft/v1/token',
  
  // Leave Requests
  MY_LEAVE_REQUESTS: '/queries/me/leave-requests',
  TEAM_LEAVE_REQUESTS: '/queries/me/team/leave-requests',
  ALL_LEAVE_REQUESTS: '/queries/leave-requests',
  PENDING_LEAVE_REQUESTS: '/queries/leave-requests/pending',
  CREATE_LEAVE_REQUEST: '/commands/sync/create-leave-request',
  UPDATE_LEAVE_REQUEST: '/commands/sync/update-leave-request',
  DELETE_LEAVE_REQUEST: '/commands/sync/delete-leave-request',
  APPROVE_LEAVE_REQUEST: '/commands/sync/approve-leave-request',
  DENY_LEAVE_REQUEST: '/commands/sync/deny-leave-request',
  
  // Leave Types
  LEAVE_TYPES: '/queries/leave-types',
  
  // Projects
  PROJECTS_SUMMARY: '/queries/projects-summary',
  PROJECT_DETAIL: (projectId: string) => `/queries/projects/${projectId}`,
  CREATE_PROJECT: '/commands/sync/create-project',
  UPDATE_PROJECT: '/commands/sync/update-project',
  CANCEL_PROJECT: '/commands/sync/cancel-project',
  
  // Tasks
  TASKS: '/queries/tasks',
  USER_TASKS: (userId: string) => `/queries/tasks/user/${userId}`,
  TASK_DETAIL: (taskId: string) => `/queries/tasks/${taskId}`,
  CREATE_TASK: '/commands/sync/create-task',
  UPDATE_TASK: '/commands/sync/update-task',
  DELETE_TASK: '/commands/sync/delete-task',
  MOVE_TASK: '/commands/sync/move-task',
  TASK_STAGES: '/queries/task-stages',
  
  // Calendar & Events
  EVENTS: '/queries/events',
  MY_EVENTS: '/queries/me/events',
  CREATE_EVENT: '/commands/sync/create-event',
  UPDATE_EVENT: '/commands/sync/update-event',
  DELETE_EVENT: '/commands/sync/delete-event',
  
  // Timesheets
  MY_TIMESHEETS: '/queries/me/timesheets',
  TIMESHEETS: '/queries/timesheets',
  TEAM_TIMESHEETS: '/queries/me/team/timesheets',
  TIMESHEET_BY_ID: '/queries/timesheets',   // append /:id
  TIMESHEET_STREAM: '/queries/timesheet-stream',
  CREATE_TIMESHEET: '/commands/sync/timesheets/create-timesheet',
  UPDATE_TIMESHEET: '/commands/sync/timesheets/update-timesheet',
  DELETE_TIMESHEET: '/commands/sync/timesheets/delete-timesheet',
  CREATE_TIMESHEET_COMMENT: '/commands/sync/timesheets/create-comment',
  
  // Expenses
  EXPENSES: '/queries/expenses',
  MY_EXPENSES: '/queries/me/expenses',
  CREATE_EXPENSE: '/commands/sync/expenses/create-expense',
  UPDATE_EXPENSE: '/commands/sync/expenses/update-expense',
  DELETE_EXPENSE: '/commands/sync/expenses/delete-expense',
  APPROVE_EXPENSE: '/commands/sync/expenses/approve',
  DENY_EXPENSE: '/commands/sync/expenses/deny',
  
  // Invoices
  INVOICES: '/queries/invoices',
  CREATE_INVOICE: '/commands/sync/create-invoice',
  UPDATE_INVOICE: '/commands/sync/update-invoice',
  DELETE_INVOICE: '/commands/sync/delete-invoice',
  SEND_INVOICE: '/commands/sync/send-invoice',
  
  // Dashboard
  DEPARTMENTS: '/queries/departments',
  WHATS_PENDING: '/queries/whats-pending',
  WHATS_NEW: '/queries/whats-new',
  WHOS_WHERE: '/queries/who-is-where',
  
  // Files
  PROJECT_FILES: (projectId: string) => `/queries/files/projects/${projectId}`,
  TASK_FILES: (taskId: string) => `/queries/files/tasks/${taskId}`,
  EVENT_FILES: (eventId: string) => `/queries/files/events/${eventId}`,
  FILE_DETAIL: (fileId: string) => `/queries/files/${fileId}`,
  FILE_DOWNLOAD: (token: string) => `/queries/file/${token}`,
  UPLOAD_URL: '/commands/sync/upload-url',
  DELETE_FILE: '/commands/sync/delete-file',
  
  // Comments
  PROJECT_COMMENTS: (projectId: string) => `/queries/comments/project/${projectId}`,
  TASK_COMMENTS: (taskId: string) => `/queries/comments/task/${taskId}`,
  CREATE_COMMENT: '/commands/sync/projects/create-comment',
  
  // Clients
  CLIENTS: '/queries/clients',
  CREATE_CLIENT: '/commands/sync/create-client',
  UPDATE_CLIENT: '/commands/sync/update-client',
  DELETE_CLIENT: '/commands/sync/delete-client',
  
  // Gantt
  GANTT: (projectId: string) => `/queries/gantt/${projectId}`,
  GANTT_DETAILS: (projectId: string) => `/queries/gantt-plus/${projectId}/details`,
  GANTT_MOVE_TASK: '/commands/sync/gantt-plus/move-task',
  GANTT_REORDER_TASK: '/commands/sync/gantt-plus/move-task-position',
  
  // Settings
  COMPANY: '/queries/company',
  UPDATE_COMPANY: '/commands/sync/update-company',
  OFFICES: '/queries/offices',
  CREATE_OFFICE: '/commands/sync/create-office',
  UPDATE_OFFICE: '/commands/sync/update-office',
  DELETE_OFFICE: '/commands/sync/delete-office',
  COST_TYPES: '/queries/cost-types',
  PROJECT_TYPES: '/queries/project-types',
  FINANCIAL_TYPES: '/queries/financial-types',

  // Policies
  POLICIES: '/queries/policies',
  CREATE_POLICY: '/commands/sync/create-policy',
  UPDATE_POLICY: '/commands/sync/update-policy',
  DELETE_POLICY: '/commands/sync/delete-policy',

  // Workflows
  WORKFLOWS: '/queries/workflows',
  CREATE_WORKFLOW: '/commands/sync/create-workflow',
  UPDATE_WORKFLOW: '/commands/sync/update-workflow',
  DELETE_WORKFLOW: '/commands/sync/delete-workflow',

  // Cost Centers
  COST_CENTERS: '/queries/cost-centers',
  CREATE_COST_CENTER: '/commands/sync/create-cost-center',
  UPDATE_COST_CENTER: '/commands/sync/update-cost-center',
  DELETE_COST_CENTER: '/commands/sync/delete-cost-center',

  // Staff Categories
  STAFF_CATEGORIES: '/queries/staff-categories',
  CREATE_STAFF_CATEGORY: '/commands/sync/create-staff-category',
  UPDATE_STAFF_CATEGORY: '/commands/sync/update-staff-category',
  DELETE_STAFF_CATEGORY: '/commands/sync/delete-staff-category',
} as const;
