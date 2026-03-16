/**
 * API Type Definitions
 * TypeScript interfaces matching Workdeck API responses
 */

// ============================================================================
// Base Types
// ============================================================================

export interface ApiResponse<T> {
  status: 'OK' | 'KO';
  result: T;
  errors?: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
}

export interface BaseIdModel {
  id: string;
}

export interface BaseUuidModel {
  id: string;
}

// ============================================================================
// User & Auth Types
// ============================================================================

export interface LoginRequest {
  mail: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  token: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  office?: Office;
  department?: Department;
  manager?: UserBasic;
  isManager: boolean;
  isGuest: boolean;
  language?: Language;
  timeTable?: any;
  staffCategory?: any;
  costPerHour?: string;
  lastLogin?: string;
  isAdmin?: boolean;
  isPurchaseAdmin?: boolean;
  isExpenseAdmin?: boolean;
  isTravelAdmin?: boolean;
  isClientAdmin?: boolean;
}

export interface UserBasic {
  id: string;
  fullName: string;
}

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  office?: Office;
  department?: Department;
}

// ============================================================================
// Profile & Notification Types
// ============================================================================

export interface CalendarSyncData {
  type: string;        // 'google' | 'microsoft'
  isActivated: boolean;
  from?: string;       // DD/MM/YYYY
}

export interface UserProfile extends User {
  firstName?: string;
  lastName?: string;
  rol?: string;                     // job title
  avatar?: string;
  calendarSync?: CalendarSyncData;
  microsoftCalendarSync?: CalendarSyncData;
  eventReminderValue?: number;
  eventReminderUnit?: number;       // 0=min, 1=hr, 2=day, 3=week
  planTime?: boolean;
  remainingHolidays?: number;
  pendingLeaves?: number;
}

export interface NotificationSettings {
  comment: string;      // 'none' | 'all' | 'mentioned'
  commentMail: string;  // 'none' | 'all' | 'mentioned'
}

// ============================================================================
// Leave Management Types
// ============================================================================

export interface LeaveType {
  id: string;
  name: string;
  color: string;
  enabled?: boolean;
  volatile?: boolean;
  daysPerYear?: number;
}

export interface LeaveRequest {
  id: string;
  user: UserBasic;
  leaveType: LeaveType;
  startDate: string; // DD/MM/YYYY format
  endDate: string; // DD/MM/YYYY format
  days: number;
  status: 0 | 1 | 2; // 0=Pending, 1=Approved, 2=Denied
  comment?: string;
  approver?: UserBasic;
}

export interface CreateLeaveRequestPayload {
  leaveType: { id: string };
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  comment?: string;
}

export interface ApproveLeaveRequestPayload {
  id: string;
  comment?: string;
}

export interface DenyLeaveRequestPayload {
  id: string;
  comment: string;
}

// ============================================================================
// Organization Types
// ============================================================================

export interface Office {
  id: string;
  name: string;
  address?: string;
  isMain?: boolean;
  currency?: Currency;
  nonWorkingDays?: NonWorkingDay[];
  timeTables?: TimeTable[];
  staffCategories?: StaffCategory[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  manager?: UserBasic;
  members?: UserBasic[];
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: Country;
  phone?: string;
  email?: string;
  website?: string;
  currency?: Currency;
  timezone?: string;
  zipCode?: string;
  vatNumber?: string;
  sector?: CompanySector;
  language?: Language;
  size?: CompanySize;
  enabled?: boolean;
  expireAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanySector {
  id: string;
  description: string;
}

export interface CompanySize {
  id: string;
  description: string;
}

export interface Currency {
  id: string;
  name: string;
  symbol?: string;
  exchangeRate?: string;
}

export interface Country {
  id: string;
  name: string;
  code?: string;
}

export interface Language {
  id: string;
  name: string;
  code?: string;
}

export interface NonWorkingDay {
  id: string;
  name: string;
  date: string;
}

export interface TimeTable {
  id: string;
  name: string;
  timezone: string;
  weekStartOn: number;
  weekEndOn: number;
  dayStartOn: string;
  dayEndOn: string;
  timeBlock: string;
}

export interface StaffCategory {
  id: string;
  name: string;
  hourlyRate: string;
}

// ============================================================================
// Project & Task Types
// ============================================================================

export interface Project {
  id: string;
  name: string;
  code: string;
  startDate: string; // DD/MM/YYYY
  endDate: string; // DD/MM/YYYY
  billable: boolean;
  timesheet?: boolean;
  client?: Client;
  projectType?: ProjectType;
  financialType?: FinancialType;
  company?: Company;
  creator?: UserBasic;
  members?: ProjectMember[];
  activities?: Activity[];
  milestones?: Milestone[];
  budgets?: Budget[];
  alerts?: any[];
  allocatedHours?: string;
}

export interface ProjectMember {
  user: UserBasic;
  isProjectManager: boolean;
}

export interface Activity {
  id: string;
  name: string;
  position: number;
  parentId?: string;
  startDate?: string;
  endDate?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  name: string;
  summary: string;
  description?: string;
  activity?: {
    id: string;
    name: string;
    project?: {
      id: string;
      name: string;
    };
  };
  column?: TaskStage;
  startDate?: string;
  endDate?: string;
  importance?: number;
  color?: string;
  billable?: boolean;
  timesheet?: boolean;
  position: number;
  globalPosition?: number;
  plannedHours?: string;
  spentHours?: string;
  availableHours?: string;
  participants?: TaskParticipant[];
  checklist?: ChecklistItem[];
  files?: any[];
  labels?: Label[];
  predecessors?: any[];
  successors?: any[];
  numComments?: number;
  numFlags?: number;
  numAttachments?: number;
  numChecklist?: number;
  numChecklistDone?: number;
}

export interface TaskParticipant {
  user: UserBasic;
  isOwner: boolean;
  plannedHours?: string;
  spentHours?: string;
}

export interface TaskStage {
  id: string;
  name: string;
  position: number;
  color?: string;
  isSystem?: boolean;
  systemCode?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  date: string;
  description?: string;
}

export interface Budget {
  id: string;
  projectId: string;
  name: string;
  amount: string;
  currency: Currency;
}

export interface Client {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ProjectType {
  id: string;
  name: string;
  color?: string;
}

export interface FinancialType {
  id: string;
  name: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

// ============================================================================
// Calendar & Events Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string; // ISO 8601
  endAt: string; // ISO 8601
  address?: string;
  color?: string;
  secondaryColor?: string;
  private?: boolean;
  billable?: boolean;
  timesheet?: boolean;
  task?: Task;
  project?: Project;
  creator?: UserBasic;
  guests?: EventGuest[];
  externalGuests?: ExternalGuest[];
  recurrence?: any;
  timezone?: string;
}

export interface EventGuest {
  user: UserBasic;
  status: number;
}

export interface ExternalGuest {
  email: string;
}

// ============================================================================
// Timesheet Types
// ============================================================================

export interface Timesheet {
  id: string;
  user: UserBasic;
  date: string; // DD/MM/YYYY
  hours: string;
  task?: Task;
  project?: Project;
  description?: string;
}

// ============================================================================
// Expense Types
// ============================================================================

export interface Expense {
  id: string;
  user: UserBasic;
  project?: Project;
  date: string; // DD/MM/YYYY
  amount: string;
  currency: Currency;
  category: string;
  description?: string;
  status: number;
  items?: ExpenseItem[];
  receipts?: any[];
}

export interface ExpenseItem {
  description: string;
  amount: string;
}

// ============================================================================
// Invoice Types
// ============================================================================

export interface Invoice {
  id: string;
  number: string;
  client: Client;
  date: string; // DD/MM/YYYY
  dueDate: string; // DD/MM/YYYY
  amount: string;
  currency: Currency;
  status: string;
  items: InvoiceItem[];
  tax?: string;
  total: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: string;
  amount: string;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface WhatsPending {
  tasks: number;
  leaveRequests: number;
  expenses: number;
  timesheets: number;
  total: number;
}

export interface WhatsNew {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  entity?: {
    id: string;
    type: string;
  };
}

// ============================================================================
// Cost Type
// ============================================================================

export interface CostType {
  id: string;
  name: string;
  enabled?: boolean;
  volatile?: boolean;
}