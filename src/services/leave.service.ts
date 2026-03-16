/**
 * Leave Management Service
 * Handles leave requests, approvals, and leave types
 */

import { apiClient } from './api-client';
import { ENDPOINTS } from '../config/api';
import {
  LeaveRequest,
  LeaveType,
  CreateLeaveRequestPayload,
  ApproveLeaveRequestPayload,
  DenyLeaveRequestPayload,
} from '../types/api';

export class LeaveService {
  /**
   * Get current user's leave requests
   */
  async getMyLeaveRequests(startDate?: string, endDate?: string): Promise<LeaveRequest[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await apiClient.get<LeaveRequest[]>(ENDPOINTS.MY_LEAVE_REQUESTS, params);
  }

  /**
   * Get team leave requests (for managers)
   */
  async getTeamLeaveRequests(startDate?: string, endDate?: string): Promise<LeaveRequest[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await apiClient.get<LeaveRequest[]>(ENDPOINTS.TEAM_LEAVE_REQUESTS, params);
  }

  /**
   * Get all leave requests (admin only)
   */
  async getAllLeaveRequests(
    startDate?: string,
    endDate?: string,
    userId?: string,
    status?: number
  ): Promise<LeaveRequest[]> {
    const params: Record<string, any> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (userId) params.userId = userId;
    if (status !== undefined) params.status = status;

    return await apiClient.get<LeaveRequest[]>(ENDPOINTS.ALL_LEAVE_REQUESTS, params);
  }

  /**
   * Get pending leave requests awaiting approval
   */
  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await apiClient.get<LeaveRequest[]>(ENDPOINTS.PENDING_LEAVE_REQUESTS);
  }

  /**
   * Create a new leave request
   */
  async createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
    return await apiClient.post<LeaveRequest>(ENDPOINTS.CREATE_LEAVE_REQUEST, payload);
  }

  /**
   * Update an existing leave request
   */
  async updateLeaveRequest(
    id: string,
    payload: Partial<CreateLeaveRequestPayload>
  ): Promise<LeaveRequest> {
    return await apiClient.post<LeaveRequest>(ENDPOINTS.UPDATE_LEAVE_REQUEST, {
      id,
      ...payload,
    });
  }

  /**
   * Delete a leave request
   */
  async deleteLeaveRequest(id: string): Promise<void> {
    await apiClient.post<void>(ENDPOINTS.DELETE_LEAVE_REQUEST, { id });
  }

  /**
   * Approve a leave request
   */
  async approveLeaveRequest(id: string, comment?: string): Promise<void> {
    const payload: ApproveLeaveRequestPayload = { id };
    if (comment) payload.comment = comment;

    await apiClient.post<void>(ENDPOINTS.APPROVE_LEAVE_REQUEST, payload);
  }

  /**
   * Deny a leave request
   */
  async denyLeaveRequest(id: string, comment: string): Promise<void> {
    const payload: DenyLeaveRequestPayload = { id, comment };
    await apiClient.post<void>(ENDPOINTS.DENY_LEAVE_REQUEST, payload);
  }

  /**
   * Get all available leave types
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    return await apiClient.get<LeaveType[]>(ENDPOINTS.LEAVE_TYPES);
  }
}

export const leaveService = new LeaveService();
