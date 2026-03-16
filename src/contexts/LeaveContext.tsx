import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Palmtree,
  Plane,
  Activity,
  Baby,
  Users,
  Home,
  Stethoscope,
  BookOpen,
  Building2,
  Store,
  GraduationCap,
  Briefcase,
  CalendarCheck,
  CalendarX,
  MapPin
} from 'lucide-react';
import { leaveService } from '../services/leave.service';
import { useCurrentUser, useUsers } from '../hooks/useApiQueries';
import { LeaveType as ApiLeaveType, LeaveRequest as ApiLeaveRequest } from '../types/api';

export type LeaveType =
  | 'Holidays'
  | 'Travel'
  | 'Sick'
  | 'Maternity'
  | 'Paternity'
  | 'Work from Home'
  | 'Doctor Appointment'
  | 'Training'
  | 'External Meeting'
  | 'Trade Show'
  | 'Conference'
  | 'Commercial Visit'
  | 'Paid Leave'
  | 'Unpaid Leave'
  | 'Working@Client';

export type LeaveStatus = 'Pending' | 'Approved' | 'Denied';

export type LeaveDuration = 'Full Day' | 'Half Day (AM)' | 'Half Day (PM)';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  leaveType: LeaveType;
  startDate: string; // ISO format
  endDate: string; // ISO format
  duration: LeaveDuration;
  calendarDays: number;
  workingDays: number;
  status: LeaveStatus;
  notes?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  addToCalendar?: boolean;
  billable?: boolean;
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  deniedReason?: string;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  location: string;
  holidayBalance: number;
}

export const leaveTypeConfig: Record<LeaveType, { icon: ReactNode; color: string }> = {
  'Holidays': { icon: <Palmtree />, color: '#10B981' },
  'Travel': { icon: <Plane />, color: '#F59E0B' },
  'Sick': { icon: <Activity />, color: '#EF4444' },
  'Maternity': { icon: <Baby />, color: '#3B82F6' },
  'Paternity': { icon: <Users />, color: '#06B6D4' },
  'Work from Home': { icon: <Home />, color: '#8B5CF6' },
  'Doctor Appointment': { icon: <Stethoscope />, color: '#EC4899' },
  'Training': { icon: <BookOpen />, color: '#F97316' },
  'External Meeting': { icon: <Building2 />, color: '#84CC16' },
  'Trade Show': { icon: <Store />, color: '#14B8A6' },
  'Conference': { icon: <GraduationCap />, color: '#6366F1' },
  'Commercial Visit': { icon: <Briefcase />, color: '#22C55E' },
  'Paid Leave': { icon: <CalendarCheck />, color: '#A855F7' },
  'Unpaid Leave': { icon: <CalendarX />, color: '#6B7280' },
  'Working@Client': { icon: <MapPin />, color: '#0EA5E9' },
};

interface LeaveContextType {
  leaveRequests: LeaveRequest[];
  users: User[];
  currentUser: User | null;
  leaveTypes: { id: string; name: string }[];
  isLoading: boolean;
  error: string | null;
  addLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'submittedDate'>) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  approveLeaveRequest: (id: string) => Promise<void>;
  denyLeaveRequest: (id: string, reason: string) => Promise<void>;
  refreshLeaveRequests: () => Promise<void>;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

// Convert API date format DD/MM/YYYY to ISO YYYY-MM-DD
function apiDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Convert ISO YYYY-MM-DD to API date format DD/MM/YYYY
function isoToApiDate(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

// Map API status number to UI status string
function mapApiStatus(status: number): LeaveStatus {
  switch (status) {
    case 0: return 'Pending';
    case 1: return 'Approved';
    case 2: return 'Denied';
    default: return 'Pending';
  }
}

// Calculate working days between two dates (rough estimate)
function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(1, count);
}

// Convert API leave request to context LeaveRequest
function convertApiLeaveRequest(apiReq: ApiLeaveRequest): LeaveRequest {
  const startISO = apiDateToISO(apiReq.startDate);
  const endISO = apiDateToISO(apiReq.endDate);
  const start = new Date(startISO);
  const end = new Date(endISO);
  const calendarDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return {
    id: apiReq.id,
    userId: apiReq.user?.id || '',
    userName: apiReq.user?.fullName || 'Unknown',
    leaveType: (apiReq.leaveType?.name || 'Holidays') as LeaveType,
    startDate: startISO,
    endDate: endISO,
    duration: apiReq.days <= 0.5 ? 'Half Day (AM)' : 'Full Day',
    calendarDays,
    workingDays: apiReq.days || calculateWorkingDays(startISO, endISO),
    status: mapApiStatus(apiReq.status),
    notes: apiReq.comment,
    submittedDate: startISO,
    approvedBy: apiReq.approver?.fullName,
  };
}

export function LeaveProvider({ children }: { children: ReactNode }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user and users list via TanStack Query
  const {
    data: apiCurrentUser,
    isLoading: currentUserLoading,
    error: currentUserError,
  } = useCurrentUser();
  const {
    data: apiUsers,
    isLoading: usersLoading,
    error: usersError,
  } = useUsers();

  // Fetch leave-specific data via leaveService on mount
  useEffect(() => {
    let cancelled = false;
    const loadLeaveData = async () => {
      try {
        const [apiLeaveTypes, apiLeaveRequests] = await Promise.all([
          leaveService.getLeaveTypes().catch(() => [] as ApiLeaveType[]),
          leaveService.getAllLeaveRequests().catch(() => [] as ApiLeaveRequest[]),
        ]);
        if (cancelled) return;

        if (apiLeaveTypes.length > 0) {
          setLeaveTypes(apiLeaveTypes.map(lt => ({ id: lt.id, name: lt.name })));
        } else {
          setLeaveTypes(Object.keys(leaveTypeConfig).map((name, idx) => ({
            id: `lt-fallback-${idx}`,
            name,
          })));
        }

        setLeaveRequests(apiLeaveRequests.map(convertApiLeaveRequest));
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load leave data:', err);
        setError('Failed to load leave data.');
      }
    };
    loadLeaveData();
    return () => { cancelled = true; };
  }, []);

  // Sync current user data
  useEffect(() => {
    if (apiCurrentUser) {
      setCurrentUser({
        id: apiCurrentUser.id,
        name: apiCurrentUser.fullName,
        department: (apiCurrentUser.department as any)?.name || '',
        location: (apiCurrentUser.office as any)?.name || '',
        holidayBalance: 0,
      });
    }
  }, [apiCurrentUser]);

  // Sync users list
  useEffect(() => {
    if (apiUsers) {
      setUsers(apiUsers.map(u => ({
        id: u.id,
        name: u.fullName,
        department: (u.department as any)?.name || '',
        location: (u.office as any)?.name || '',
        holidayBalance: 0,
      })));
    }
  }, [apiUsers]);

  // Derive combined loading and error state
  useEffect(() => {
    if (!currentUserLoading && !usersLoading) {
      setIsLoading(false);
    }
  }, [currentUserLoading, usersLoading]);

  useEffect(() => {
    if (currentUserError || usersError) {
      setError((currentUserError as Error)?.message || (usersError as Error)?.message || 'Failed to load leave data.');
    }
  }, [currentUserError, usersError]);

  /**
   * Refresh leave requests from API
   */
  const refreshLeaveRequests = async () => {
    try {
      const apiLeaveRequests = await leaveService.getAllLeaveRequests();
      setLeaveRequests(apiLeaveRequests.map(convertApiLeaveRequest));
    } catch (err) {
      console.error('Failed to refresh leave requests:', err);
    }
  };

  /**
   * Add a new leave request via API
   */
  const addLeaveRequest = async (
    request: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'submittedDate'>
  ) => {
    if (!currentUser) return;

    // Find the leave type ID
    const leaveTypeEntry = leaveTypes.find(lt => lt.name === request.leaveType);

    try {
      await leaveService.createLeaveRequest({
        leaveType: { id: leaveTypeEntry?.id || '' },
        startDate: isoToApiDate(request.startDate),
        endDate: isoToApiDate(request.endDate),
        comment: request.notes,
      });
      // Refresh to get the server-generated request
      await refreshLeaveRequests();
    } catch (err) {
      console.error('Failed to create leave request:', err);
      // Optimistic fallback: add locally
      const newRequest: LeaveRequest = {
        ...request,
        id: `leave-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        submittedDate: new Date().toISOString().split('T')[0],
      };
      setLeaveRequests(prev => [...prev, newRequest]);
    }
  };

  /**
   * Delete a leave request via API
   */
  const deleteLeaveRequest = async (id: string) => {
    try {
      await leaveService.deleteLeaveRequest(id);
      setLeaveRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      console.error('Failed to delete leave request:', err);
      // Optimistic removal
      setLeaveRequests(prev => prev.filter(req => req.id !== id));
    }
  };

  /**
   * Approve a leave request via API
   */
  const approveLeaveRequest = async (id: string) => {
    try {
      await leaveService.approveLeaveRequest(id);
      setLeaveRequests(prev => prev.map(req =>
        req.id === id
          ? {
              ...req,
              status: 'Approved' as LeaveStatus,
              approvedBy: currentUser?.name || 'Manager',
              approvedDate: new Date().toISOString().split('T')[0]
            }
          : req
      ));
    } catch (err) {
      console.error('Failed to approve leave request:', err);
      // Optimistic update
      setLeaveRequests(prev => prev.map(req =>
        req.id === id
          ? { ...req, status: 'Approved' as LeaveStatus, approvedBy: currentUser?.name || 'Manager', approvedDate: new Date().toISOString().split('T')[0] }
          : req
      ));
    }
  };

  /**
   * Deny a leave request via API
   */
  const denyLeaveRequest = async (id: string, reason: string) => {
    try {
      await leaveService.denyLeaveRequest(id, reason);
      setLeaveRequests(prev => prev.map(req =>
        req.id === id
          ? { ...req, status: 'Denied' as LeaveStatus, deniedReason: reason }
          : req
      ));
    } catch (err) {
      console.error('Failed to deny leave request:', err);
      // Optimistic update
      setLeaveRequests(prev => prev.map(req =>
        req.id === id
          ? { ...req, status: 'Denied' as LeaveStatus, deniedReason: reason }
          : req
      ));
    }
  };

  return (
    <LeaveContext.Provider value={{
      leaveRequests,
      users,
      currentUser,
      leaveTypes,
      isLoading,
      error,
      addLeaveRequest,
      deleteLeaveRequest,
      approveLeaveRequest,
      denyLeaveRequest,
      refreshLeaveRequests,
    }}>
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeave() {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
}
