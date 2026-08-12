export type CrmTaskType = 'Call' | 'Email' | 'Sms' | 'Appointment' | 'FollowUp' | 'Other';
export type CrmTaskStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface CrmTask {
  id: string; leadId: string; type: CrmTaskType; title: string; notes: string | null;
  dueAtUtc: string; assignedToUserId: string | null; status: CrmTaskStatus;
  closedAtUtc: string | null; createdAtUtc: string;
}

export interface CreateCrmTaskRequest {
  type: CrmTaskType; title: string; notes: string | null; dueAtUtc: string;
  assignedToUserId: string | null;
}
